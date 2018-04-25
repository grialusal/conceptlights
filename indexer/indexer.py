import os
import fnmatch
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from bs4 import BeautifulSoup
import pymysql


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

body = {"settings" : {
		"index": { "number_of_shards": 1,
					"number_of_replicas": 0
				}
	}}

es.indices.create( index='dboe', ignore=400, body=body )

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
			if not usg or len(list(usg.descendants)) < 5:
				print("Could not find usg or it does not contain enough info")
				continue
			for child in usg.descendants:
				print(child)

			continue

			entryObj = {}
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
				print('indexing 50 entries...')
				bulk(es, actions)
				print('indexed')
				actions = []

exit(0)