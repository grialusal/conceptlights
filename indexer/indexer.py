import os
import fnmatch
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from bs4 import BeautifulSoup
import pymysql
import json


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

db_cur = conn.cursor()

actions = []

rootPath = './data'
pattern = 'r*.xml' #WIP: Test only with entries starting with 'r' for the moment

#Walk data dir extracting the different entries
for root, dirs, files in os.walk(rootPath):
	for filename in fnmatch.filter(files, pattern):
		print(os.path.join(root, filename))
		soup = BeautifulSoup(open(os.path.join(root, filename), "r", encoding="utf-8"), 'xml')
		for entry in soup.find_all("entry"):
			usg = entry.find('usg')
			if not usg:
				continue
			else:
				place = usg.find("place", {"type" : "Ort"})
				if not place:
					continue

			entryObj = {}
			entryObj['placeName'] = place.placeName.string
			entryObj['sigle'] = place.idno.string

			point = None
			query = "SELECT ST_AsGeoJSON(dboe_1.GISort.the_geom) AS geom FROM dboe_1.GISort WHERE dboe_1.GISort.name='{}'".format(place.placeName.string)
			number_of_rows = db_cur.execute(query)
			if number_of_rows > 0:
				point = db_cur.fetchone()['geom']
			else:
				query = "SELECT  ST_AsGeoJSON(dboe_1.GISort.the_geom) AS geom  FROM dboe_1.GISort" \
			+ " INNER JOIN dboe_1.ort ON  dboe_1.GISort.id = dboe_1.ort.gis_ort_id where dboe_1.ort.originaldaten like '%{}%'".format(place.idno.string)
				number_of_rows = db_cur.execute(query)
				if number_of_rows > 0:
					point = db_cur.fetchone()['geom']
			
			if point:
				pointObj = json.loads(point)
				entryObj['location'] = {'lat': pointObj['coordinates'][1], 'lon': pointObj['coordinates'][0]}
			else:
				continue

			entryObj['main_lemma'] = str(entry.form.orth.string)
			if len(entryObj['main_lemma']) == 0:
				continue
			entryObj['id'] = entry['xml:id']
			#part of speech
			entryObj['pos'] = str(entry.gramGrp.pos.string)
			
			if entry.sense:
				entryObj['sense'] = entry.sense.text.replace('\n', '')

			if entry.note:
				entryObj['note'] = entry.note.text.replace('\n', '')

			
			questionnaire = entry.findAll(
								"ref", {"type": "fragebogenNummer"})
			if len(questionnaire) > 0:
				entryObj['questionnaire'] = questionnaire[0].string

			
			source = entry.findAll(
								"ref", {"type": "quelle"})
			if len(source) > 0:
				entryObj['source'] = source[0].string


			revised_source = entry.findAll(
								"ref", {"type": "quelleBearbeitet"})
			if len(revised_source) > 0:
				entryObj['revised_source'] = revised_source[0].text


			actions.append({
					'_index': 'dboe',
					'_type': 'dboe-type',
					'_source': entryObj
			})
			if len(actions) > 50:
				bulk(es, actions)
				actions = []
print('Done')
exit(0)