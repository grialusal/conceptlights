import os
import fnmatch
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from bs4 import BeautifulSoup
import pymysql
import json
import re
from stop_words import get_stop_words

db_cur = None


def process_listplace_node(listplace_soup, listplace_node):
	results = {}
	for place in listplace_node.find_all("place", recursive=False):
		results.update(process_place_node(listplace_soup, place))
	return results

def process_place_node(listplace_soup, place_node):
	result = {}

	place_type = place_node.attrs['type']
	listplace_node = place_node.find("listPlace", recursive=False)

	if listplace_node:
		result.update(process_listplace_node(listplace_soup, listplace_node))

	mysql_id = None
	#print(place_node.placeName.string, place_type)
	
	for entry in listplace_soup.find_all('placeName', text=place_node.placeName.string):
		if entry.parent.get("type") == place_type and entry.parent.mysql_id:
			mysql_id = entry.parent.mysql_id.string
			if mysql_id:
				if place_type == 'Großregion':
					result.update({'grossregion' : mysql_id})
				else:
					result.update({place_type.lower() : mysql_id})
					if place_type == 'Ort':
						result.update({'place_name': place_node.placeName.string})
						point = extract_geo_point(mysql_id)
						if point:
							result.update({'location' : point})
			if "idno" not in result:
				result.update({"idno" : entry.parent.idno.string})
			break
	if 'ort' in result:
		result.update({'resolution' : 5})
	elif 'gemeinde' in result:
		result.update({'resolution' : 4})
	elif 'kleinregion' in result:
		result.update({'resolution' : 3})
	elif 'großregion' in result:
		result.update({'resolution' : 2})
	elif 'bundesland' in result:
		result.update({'resolution' : 1})

	


	return result

def extract_geo_point(mysql_id):
	point = None
	query = "SELECT ST_AsGeoJSON(dboe_1.GISort.the_geom) AS geom FROM dboe_1.GISort INNER JOIN dboe_1.ort WHERE dboe_1.ort.id='{}'".format(mysql_id)
	number_of_rows = db_cur.execute(query)

	if number_of_rows > 0:
		point = db_cur.fetchone()['geom']
		point_obj = json.loads(point)
		return {'lat': point_obj['coordinates'][1], 'lon': point_obj['coordinates'][0]}
	else: return None

def main():
	print("Connecting to ES...")
	es = Elasticsearch(hosts=[{"host":'elasticsearch'}])
	if not es.ping():
		raise ValueError("Connection failed")
	else:
		print('Connected to ES')

	print("Connecting to MySQL...")
	conn= pymysql.connect(host='conceptlights_db_1',user='root',password='password',db='dboe_1',charset='utf8mb4',cursorclass=pymysql.cursors.DictCursor)
	if conn.open:
		print('Connected to MySQL')
	else:
		print('Connection to MySQL failed')

	if es.indices.exists(index='dboe'):
		print('dboe index exists, deleting...')
		if es.indices.delete(index='dboe'):
			print('dboe index deleted, will reindex now.')

	body = {
				"settings" : {
					"number_of_shards": 1,
					"number_of_replicas": 0
				},
				"mappings": {
					"dboe-type": {
							"properties": {
								"location" : {
									"type" : "geo_point"
						}
					}
				}
			}}

	es.indices.create( index='dboe', ignore=400, body=body )

	global db_cur
	db_cur = conn.cursor()
	actions = []

	rootPath = './data'
	pattern = '*1_qdb-TEI-02.xml' #WIP: Test only with entries starting with 'm,n,o,p,q' for the moment
	listplace_path = './data/helper_tables/listPlace-id.xml'
	fragebogen_concepts_path = './data/frage-fragebogen-full-tgd01.xml'

	q_regex = r"^(\d+)(\w+)"
	# q_head_regex = r"pc> (.*)<"



	with open(listplace_path, "r", encoding="utf-8") as listplace_file, \
	open(fragebogen_concepts_path, "r", encoding="utf-8") as fragebogen_concepts_file:
		listplace_soup = BeautifulSoup(listplace_file, 'xml')
		fragebogen_concepts_soup = BeautifulSoup(fragebogen_concepts_file,'xml')

		stop_words = get_stop_words('de')

		#Walk data dir extracting the different entries
		for root, dirs, files in os.walk(rootPath):
			for filename in fnmatch.filter(files, pattern):
				print(os.path.join(root, filename))
				soup = BeautifulSoup(open(os.path.join(root, filename), "r", encoding="utf-8"), 'xml')
				for entry in soup.find_all("entry"):
					entry_obj= {}

					questionnaire = entry.findAll(
										"ref", {"type": "fragebogenNummer"})
					if len(questionnaire) > 0:
						entry_obj['source_question_title'] = questionnaire[0].string
						match = re.match(q_regex, entry_obj['source_question_title'])
						if match:
							entry_obj['questionnaire_number'] = match.group(1)
							entry_obj['question'] = match.group(2)
							
							questionnaire_label = fragebogen_concepts_soup.find("label", text="Fragebogen " + entry_obj['questionnaire_number'])
							if questionnaire_label:
								questionnaire_head = questionnaire_label.parent					
								entry_obj['questionnaire_label'] = questionnaire_head.contents[4]

								questionnaire = questionnaire_head.parent
								question = questionnaire.find('item', {"n" : entry_obj['question']})
								if question: 
									if question.label:
										entry_obj['question_label'] = question.label.string
									#label ?
									concepts = question.find_all('seg', attrs={"xml:id":True})
									if len(concepts) > 0:
										# print('Question {} relates to the following concepts:'.format(item.get('n')))
										concepts_set = set()
										for concept in concepts:
											# print(concept.string)
											if concept.string is not None and concept.string not in stop_words and "." not in concept.string and len(concept.string) > 1:
												concepts_set.add(concept.string)
										entry_obj['question_concepts'] =  list(concepts_set)
								else:
									continue
							else:
								print('Questionnaire ' + entry_obj['questionnaire_number'] + ' could not be found')
					else:
						continue
					
					entry_obj['main_lemma'] = str(entry.form.orth.string)
					if len(entry_obj['main_lemma']) == 0:
						continue

					entry_obj['id'] = entry['xml:id']
					#part of speech
					entry_obj['pos'] = str(entry.gramGrp.pos.string)
					
					if entry.sense:
						entry_obj['sense'] = entry.sense.text.replace('\n', '')

					if entry.note:
						entry_obj['note'] = entry.note.text.replace('\n', '')

					source = entry.findAll(
										"ref", {"type": "quelle"})
					if len(source) > 0:
						entry_obj['source'] = source[0].string

					revised_source = entry.findAll(
										"ref", {"type": "quelleBearbeitet"})
					if len(revised_source) > 0:
						entry_obj['revised_source'] = revised_source[0].text


					usg = entry.find('usg')
					if not usg:
						continue
					else:
						list_place = usg.find("listPlace", recursive=False)
						if not list_place:
							continue
						else:
							geo_dict = process_listplace_node(listplace_soup, list_place)
							entry_obj.update(geo_dict)		
					
					actions.append({
							'_index': 'dboe',
							'_type': 'dboe-type',
							'_source': entry_obj})

					if len(actions) > 50:
						bulk(es, actions)
						actions = []
				
		print('Done')

	conn.close()
	exit(0)

if __name__ == "__main__":
	main()

