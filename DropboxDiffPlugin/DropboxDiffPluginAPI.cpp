/**********************************************************\

  Auto-generated DropboxDiffPluginAPI.cpp

\**********************************************************/

#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"

#include "DropboxDiffPluginAPI.h"
#include "WebKitFS.h"
#include <sys/types.h>
#include <dirent.h>
#include <errno.h>

#define TRACE(x) m_host->htmlLog(x)

using namespace std;

static string errno_to_s(int e);
static void replace_in_place(string& target, const string& s, const string& r);


// Command-line quoting
#if defined(_WIN32)
#	define ESC_CHAR "^"
#else
#	define ESC_CHAR "\\"
#endif


///////////////////////////////////////////////////////////////////////////////
/// @fn DropboxDiffPluginAPI::DropboxDiffPluginAPI(const DropboxDiffPluginPtr& plugin, const FB::BrowserHostPtr host)
///
/// @brief  Constructor for your JSAPI object.  You should register your methods, properties, and events
///		 that should be accessible to Javascript from here.
///
/// @see FB::JSAPIAuto::registerMethod
/// @see FB::JSAPIAuto::registerProperty
/// @see FB::JSAPIAuto::registerEvent
///////////////////////////////////////////////////////////////////////////////
DropboxDiffPluginAPI::DropboxDiffPluginAPI(const DropboxDiffPluginPtr& plugin, const FB::BrowserHostPtr& host) :
	m_plugin(plugin),
	m_host(host),
	m_debug(false),
	m_path()
{
	// Properties
	registerProperty("debug",
					 make_property(this,
						&DropboxDiffPluginAPI::get_debug,
						&DropboxDiffPluginAPI::set_debug));
	// Read-only property
	registerProperty("version",
					 make_property(this,
						&DropboxDiffPluginAPI::get_version));

	// Methods
	registerMethod("exec",			make_method(this, &DropboxDiffPluginAPI::exec));
	registerMethod("compute_path",	make_method(this, &DropboxDiffPluginAPI::compute_path));

	// Default logging off
	m_host->setEnableHtmlLog(m_debug);
}

///////////////////////////////////////////////////////////////////////////////
/// @fn DropboxDiffPluginAPI::~DropboxDiffPluginAPI()
///
/// @brief  Destructor.  Remember that this object will not be released until
///		 the browser is done with it; this will almost definitely be after
///		 the plugin is released.
///////////////////////////////////////////////////////////////////////////////
DropboxDiffPluginAPI::~DropboxDiffPluginAPI()
{
}

///////////////////////////////////////////////////////////////////////////////
/// @fn DropboxDiffPluginPtr DropboxDiffPluginAPI::getPlugin()
///
/// @brief  Gets a reference to the plugin that was passed in when the object
///		 was created.  If the plugin has already been released then this
///		 will throw a FB::script_error that will be translated into a
///		 javascript exception in the page.
///////////////////////////////////////////////////////////////////////////////
DropboxDiffPluginPtr DropboxDiffPluginAPI::getPlugin()
{
	DropboxDiffPluginPtr plugin(m_plugin.lock());
	if (!plugin) {
		throw FB::script_error("The plugin is invalid");
	}
	return plugin;
}

bool DropboxDiffPluginAPI::get_debug() const { return m_debug; }
void DropboxDiffPluginAPI::set_debug(bool val)
{
	m_host->setEnableHtmlLog(m_debug = val);
}

// Read-only property version
std::string DropboxDiffPluginAPI::get_version() const
{
	return "1.0.0";
}

//
// compute_path
//
// Returns empty string on success, or an error string on failure
//
string DropboxDiffPluginAPI::compute_path(const string& extension_id, const string& beacon)
{
	TRACE("beacon:");
	TRACE(beacon);

	m_path.clear();

	// Get the OS-dependent FileSystem directory
	string root = WebKitFS::get_root(extension_id);

	TRACE("root:");
	TRACE(root);

	DIR* fs = opendir(root.c_str());

	if (!fs) return errno_to_s(errno);

	// Search root for the beacon directory, two levels down
	string path, response;

	struct dirent *fs_d;

	while ((fs_d = readdir(fs)) != NULL && m_path.empty())
	{
		// Search only directories 
		if (fs_d->d_type != DT_DIR) continue;

		// Skip ".", ".."
		if (fs_d->d_name[0] == '.') continue;

		path = root;
		path += '/';
		path += fs_d->d_name;

		TRACE("path:");
		TRACE(path);

		DIR *dir = opendir(path.c_str());

		if (dir)
		{
			struct dirent *dir_d;

			while ((dir_d = readdir(dir)) != NULL)
			{
				// Look only at files
				if (dir_d->d_type != DT_REG) continue;

				TRACE("d_name:");
				TRACE(dir_d->d_name);

				if (strcmp(dir_d->d_name, beacon.c_str()) == 0)
				{
					// Found it; OS-specific escaping for command-line
					replace_in_place(path, ESC_CHAR, ESC_CHAR ESC_CHAR);
					replace_in_place(path, "\"", ESC_CHAR "\"");

					m_path = "\"";
					m_path += path;
					m_path += "\"";

					// Delete the beacon file
					unlink((path + "/" + beacon).c_str());
					break;
				}
			}

			closedir(dir);
		}
		else
		{
			response = errno_to_s(errno);
			break;
		}
	}

	closedir(fs);

	if (!m_path.empty()) return "";

	if (response.empty())
	{
		response = "'";
		response += beacon;
		response += "' not found";
	}

	return response;
}

//
// exec
//
// Returns result of system() call (0 on success).
//
long DropboxDiffPluginAPI::exec(const string& cmd) const
{
	// Change directory to sandbox
	string cmd_cd = "cd ";
	cmd_cd += m_path;
	cmd_cd += " && ";

#if defined(_WIN32)
	// For Windows, spawn process in the background
	cmd_c += "start \"DropboxDiff\" ";
#endif

	cmd_cd += cmd;

#if defined(__linux__)
	// For linux, spawn process in the background
	cmd_cd += " &";
#endif

	TRACE("exec:");
	TRACE(cmd_cd);

	return system(cmd_cd.c_str());
}

// ===== Utility functions

static string errno_to_s(int e)
{
	switch (e)
	{
		case EACCES:
			return "Search permission is denied for the component of the path prefix of dirname or read permission is denied for dirname.";
#if !defined(_WIN32)
        case ELOOP:
			return "Too many symbolic links were encountered in resolving path.";
#endif
		case ENAMETOOLONG:
			return "The length of the dirname argument exceeds {PATH_MAX}, or a pathname component is longer than {NAME_MAX}.";
		case ENOENT:
			return "A component of dirname does not name an existing directory or dirname is an empty string.";
		case ENOTDIR:
			return "A component of dirname is not a directory.";
		case EMFILE:
			return "{OPEN_MAX} file descriptors are currently open in the calling process.";
		case ENFILE:
			return "Too many files are currently open in the system.";
		default:
			return "Unknown error";
	}
}

static void replace_in_place(string& target, const string& s, const string& r)
{
	for (string::size_type pos = 0; ((pos = target.find(s, pos)) != string::npos); pos += r.size())
	{
		target.replace(pos, s.size(), r);
	}
}

