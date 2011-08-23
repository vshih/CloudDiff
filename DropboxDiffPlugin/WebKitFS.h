
#pragma once

#include <string>

/**
 *
 * Functions related to WebKit FileSystem API.
 *
 * Reference http://www.html5rocks.com/en/tutorials/file/filesystem/
 *
 */

namespace WebKitFS
{
	std::string get_root(const std::string& extension_id);
}

