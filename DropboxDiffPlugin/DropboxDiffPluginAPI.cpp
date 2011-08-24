/**********************************************************\

  Auto-generated DropboxDiffPluginAPI.cpp

\**********************************************************/

#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"

#include "DropboxDiffPluginAPI.h"


using namespace std;

static void replace_in_place(string& target, const string& s, const string& r);


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
	m_webkit_fs(this)
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

	registerProperty("extension_id",
					 make_property(this,
						&DropboxDiffPluginAPI::get_extension_id,
						&DropboxDiffPluginAPI::set_extension_id));

	// Methods
	registerMethod("diff", make_method(this, &DropboxDiffPluginAPI::diff));

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
// get_extension_id
//
std::string DropboxDiffPluginAPI::get_extension_id() const
{
	return m_extension_id;
}

//
// set_extension_id
//
void DropboxDiffPluginAPI::set_extension_id(const string& extension_id)
{
	m_extension_id = extension_id;

	int result = m_webkit_fs.set_extension_id(extension_id);

	if (result != 0) {
		char msg[1024];
		sprintf(msg, "Error setting extension_id: %d", result);
		m_host->htmlLog(msg);
	}
}

//
// diff
//
// Returns result of system() call (0 on success).
//
long DropboxDiffPluginAPI::diff(const string& cmd, const string& left, const string& right) const
{
	vector<string> files;
	files.push_back(left);
	files.push_back(right);

	vector<string> actual_files = m_webkit_fs.get_actual_file_path(files);

	// Change directory to sandbox
	string cmd_cd = "cd \"";
	cmd_cd += m_webkit_fs.get_actual_root();
	cmd_cd += "\" && ";

#if defined(_WIN32)
	// For Windows, spawn process in the background
	cmd_cd += "start \"DropboxDiff\" ";
#endif

	cmd_cd += cmd;

	if (cmd.find("$1") != string::npos) {
		// Do file name substitutions
		replace_in_place(cmd_cd, "$1", actual_files[0]);
		replace_in_place(cmd_cd, "$2", actual_files[1]);
	}
	else {
		// Append file names
		cmd_cd += " \"";
		cmd_cd += actual_files[0];
		cmd_cd += "\" \"";
		cmd_cd += actual_files[1];
		cmd_cd += '"';
	}

#if defined(__linux__)
	// For linux, spawn process in the background
	cmd_cd += " &";
#endif

	trace(cmd_cd);

	return system(cmd_cd.c_str());
}

// ===== Utility functions

static void replace_in_place(string& target, const string& s, const string& r)
{
	for (string::size_type pos = 0; ((pos = target.find(s, pos)) != string::npos); pos += r.size())
	{
		target.replace(pos, s.size(), r);
	}
}

void DropboxDiffPluginAPI::trace(const string& s) const
{
	if (m_debug) m_host->htmlLog(s);
}

