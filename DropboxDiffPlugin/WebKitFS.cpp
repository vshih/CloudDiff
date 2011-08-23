
#include "WebKitFS.h"
#include <stdlib.h>

using namespace std;

string WebKitFS::get_root(const string& extension_id)
{
	string extension_dir	= string("chrome-extension_") + extension_id + "_0";
	string storage_type		= "Temporary";

#if defined(_WIN32)

	// LOCALAPPDATA defined in Vista and later
	char *appdata_var = getenv("LOCALAPPDATA");

	// If not found, use USERPROFILE
	string appdata = appdata_var ? appdata_var : (string(getenv("USERPROFILE")) + "\\Local Settings\\Application Data");

	return appdata + "\\Google\\Chrome\\User Data\\Default\\FileSystem\\" + extension_dir + "\\" + storage_type;

#elif defined(__APPLE__)

	return string(getenv("HOME")) + "/Library/Application Support/Google/Chrome/Default/FileSystem/" + extension_dir + "/" + storage_type;

#elif defined(__linux__)

	return string(getenv("HOME")) + "/.config/google-chrome/Default/FileSystem/" + extension_dir + "/" + storage_type;

#endif
}

