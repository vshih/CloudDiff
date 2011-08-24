
#include <assert.h>
#include "leveldb/db.h"
#include <iostream>
#include <set>

using namespace std;

string prefix = "CHILD_OF:0:";

int main(int argc, char* argv[]) {
	leveldb::DB* db;
	leveldb::Options options;
	options.create_if_missing = false;

	// Parse Origins database
	string db_name = string(getenv("HOME")) + "/Library/Application Support/Google/Chrome/Default/File System/Origins";

	leveldb::Status status = leveldb::DB::Open(options, db_name, &db);
	assert(status.ok());

	// ORIGIN:chrome-extension_oilgkmffbmahkcojommfhnmnpdchkmlh_0
	string key_name = "ORIGIN:chrome-extension_oilgkmffbmahkcojommfhnmnpdchkmlh_0";

	string db_path;
	status = db->Get(leveldb::ReadOptions(), key_name, &db_path);
	delete db;

	if (!status.ok()) {
		cout << "Extension's file system not found." << endl;
		return -1;
	}

	// Open extension's file system
	db_name = string(getenv("HOME")) + "/Library/Application Support/Google/Chrome/Default/File System/" + db_path + "/t/Paths";

	cout << "Opening database: " << db_name << endl;

	status = leveldb::DB::Open(options, db_name, &db);
	assert(status.ok());

	if (argc == 2) {
		// Find the given file
		key_name = prefix + argv[1];

		string data_key;
		status = db->Get(leveldb::ReadOptions(), key_name, &data_key);
		if (!status.ok()) {
			cout << "File not found." << endl;
			return -1;
		}

		string pickle_data;
		status = db->Get(leveldb::ReadOptions(), data_key, &pickle_data);
		if (!status.ok()) {
			cout << "File entry not found." << endl;
			return -1;
		}

		cout << "Found: " << pickle_data << endl;

		for (string::const_iterator i = pickle_data.begin(); i != pickle_data.end(); ++i) {
			cout << (int) *i << " ";
		}

		cout << endl;

		int header_size = sizeof(int);
		int parent_id_size = sizeof(int64_t);

		cout << hex << reinterpret_cast<const int*>(pickle_data.c_str()) << dec << endl;
		cout << hex << reinterpret_cast<const int*>(pickle_data.c_str() + header_size + parent_id_size) << dec << endl;

		int data_path_len = *reinterpret_cast<const int*>(pickle_data.c_str() + header_size + parent_id_size);
		cout << "data_path_len = " << data_path_len << endl;

		string data_path(pickle_data, header_size + parent_id_size + sizeof(data_path_len), data_path_len);
		
		cout << data_path << endl;
	}
	else {
		// List all files
		leveldb::Iterator* it = db->NewIterator(leveldb::ReadOptions());

		for (it->SeekToFirst(); it->Valid(); it->Next()) {
			string key = it->key().ToString();

			if (strncmp(key.c_str(), prefix.c_str(), prefix.size()) == 0) {
				cout << string(key, prefix.size()) << endl;
			}
		}
		assert(it->status().ok());  // Check for any errors found during the scan
		delete it;
	}

	delete db;

	return 0;
}
