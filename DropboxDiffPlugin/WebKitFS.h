
#pragma once

#include "leveldb/db.h"
#include <string>
#include <vector>

/**
 *
 * Functions related to WebKit FileSystem API.
 *
 * Reference http://www.html5rocks.com/en/tutorials/file/filesystem/
 *
 */

class Logger;

class WebKitFS
{
public:
	WebKitFS(Logger* logger);

	int set_extension_id(const std::string& extension_id);

	std::string get_actual_root() const;

	std::vector<std::string> get_actual_file_path(const std::vector<std::string>& files) const;

private:
	leveldb::Options	m_options;
	Logger*				m_logger;
	std::string			m_db_path;
};

