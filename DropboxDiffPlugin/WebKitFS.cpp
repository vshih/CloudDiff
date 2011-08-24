
#include "WebKitFS.h"
#include "Logger.h"
#include <memory>	// for auto_ptr
#include <stdlib.h> // for getenv

using namespace std;


static string CHILD_PREFIX = "CHILD_OF:0:";


WebKitFS::WebKitFS(Logger* logger) : m_options(), m_logger(logger)
{
	m_options.create_if_missing = false;
}


static string get_fs_dir()
{
#if defined(_WIN32)
	// LOCALAPPDATA defined in Vista and later
	char *appdata_var = getenv("LOCALAPPDATA");

	// If not found, use USERPROFILE
	string appdata = appdata_var ? appdata_var : (string(getenv("USERPROFILE")) + "\\Local Settings\\Application Data");

	return appdata + "\\Google\\Chrome\\User Data\\Default\\File System\\";

#elif defined(__APPLE__)

	return string(getenv("HOME")) + "/Library/Application Support/Google/Chrome/Default/File System/";

#elif defined(__linux__)

	return string(getenv("HOME")) + "/.config/google-chrome/Default/File System/";

#endif
}


int WebKitFS::set_extension_id(const string& extension_id)
{
	//m_logger->trace(get_fs_dir() + "Origins");

	leveldb::DB* db;
	leveldb::Status status = leveldb::DB::Open(m_options, get_fs_dir() + "Origins", &db);
	if (!status.ok()) return 1;

	auto_ptr<leveldb::DB> a_db(db);

	status = a_db->Get(leveldb::ReadOptions(), string("ORIGIN:chrome-extension_") + extension_id + "_0", &m_db_path);

	if (!status.ok()) return 2;

	return 0;
}


string WebKitFS::get_actual_root() const
{
	return get_fs_dir() + m_db_path + "/t/";
}


vector<string> WebKitFS::get_actual_file_path(const vector<string>& files) const
{
	vector<string> result;

	leveldb::DB* db;
	leveldb::Status status = leveldb::DB::Open(m_options, get_actual_root() + "Paths", &db);
	if (!status.ok()) return result;

	auto_ptr<leveldb::DB> a_db(db);

	// Iterate over files
	for (vector<string>::const_iterator i = files.begin(); i != files.end(); ++i) {
		string key_name = CHILD_PREFIX + (*i);

		string data_key;
		status = a_db->Get(leveldb::ReadOptions(), key_name, &data_key);
		if (!status.ok()) {
			result.push_back(string());
			continue;
		}

		string pickle_data;
		status = a_db->Get(leveldb::ReadOptions(), data_key, &pickle_data);
		if (!status.ok()) {
			result.push_back(string());
			continue;
		}

		int header_size = sizeof(int);
		int parent_id_size = sizeof(int64_t);

		int data_path_len = *reinterpret_cast<const int*>(pickle_data.c_str() + header_size + parent_id_size);

		result.push_back( string(pickle_data, header_size + parent_id_size + sizeof(data_path_len), data_path_len) );
	}

	return result;
}

