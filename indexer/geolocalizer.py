import os
import fnmatch
from bs4 import BeautifulSoup
import pymysql
import json
import re

def process_listplace_node(soup, listplace_node):
	for place in listplace_node.find_all("place", recursive=False):
		process_place_node(soup, place)
	return

def process_place_node(soup, place_node):
	lookup_table = "dboe_1.{}"
	query = "SELECT id FROM {} WHERE '{}' IN (nameKurz, nameLang) or originaldaten like '%{}%';"

	place_type = place_node.attrs['type']
	if place_type == 'Bundesland' or place_type == 'Großregion' or place_type == 'Kleinregion':
		lookup_table = lookup_table.format('region')
	elif place_type == 'Gemeinde':
		lookup_table = lookup_table.format('gemeinde')
	elif place_type == 'Ort':
		lookup_table = lookup_table.format('ort')
	else:
		print('Place type was not expected')
		return
	if "," in place_node.placeName.string: #Take first name only, eg: Jenesien, San Genesio Atesino
		query = query.format(lookup_table, place_node.placeName.string.split(",")[0], place_node.idno.string)
	else:
		query = query.format(lookup_table, place_node.placeName.string, place_node.idno.string)

	number_of_rows = db_cur.execute(query)
	if number_of_rows > 0:
		the_id = db_cur.fetchone()['id']
		# region_node.find('placeName').inser_after(place_node.new_tag('mysql_id', the_id))
		result = place_node.find("listPlace", recursive=False)
		if result:
			process_listplace_node(soup, result)
		
		#Save the id
		print(place_type + ' ' + place_node.placeName.string + ' ' + str(the_id))
		new_tag = soup.new_tag("mysql_id")
		new_tag.string = str(the_id)
		place_node.placeName.insert_after(new_tag)
	else:
		print('Could not find {} for name {}'.format(place_type, place_node.placeName.string))
		return None

print("Connecting to MySQL...")
conn= pymysql.connect(host='conceptlights_db_1',user='root',password='password',db='dboe_1',charset='utf8mb4',cursorclass=pymysql.cursors.DictCursor)
if conn.open:
	print('Connected to MySQL')
else:
	print('Connection to MySQL failed')

db_cur = conn.cursor()

actions = []

listplace_file = './data/helper_tables/listPlace-2.xml'
dest_file = './data/helper_tables/listPlace-id.xml'

with open(listplace_file, "r", encoding="utf-8") as file:
	soup = BeautifulSoup(file, 'xml')
	for bundesland in soup.find_all("place", {"type" : "Bundesland"}):
		process_place_node(soup, bundesland)
	file.close()
	print('Done')
	with open(dest_file, "w") as dest_file:
		dest_file.write(str(soup))
		dest_file.close()

conn.close()
exit(0)
