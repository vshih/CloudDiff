/**********************************************************\

  Auto-generated DropboxDiffPluginAPI.cpp

\**********************************************************/

#include "JSObject.h"
#include "NPObjectAPI.h"
#include "variant_list.h"
#include "DOM/Document.h"

#include "DropboxDiffPluginAPI.h"

#if defined (_WIN32)
#	include <direct.h>
#	define mkdir(dirname, mode) _mkdir(dirname)
#endif

#include <sys/stat.h> // for stat
#include <fstream>


using namespace std;

static void		replace_in_place(string& target, const string& s, const string& r);
static string	quote(const string& s);

struct rm : public unary_function<string, void>
{
	void operator()(const string& file)
	{
		remove(file.c_str());
	}
};


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
	m_debug(false)
{
	// Compute temporary directory
#if defined(_WIN32)
	char* tmp = getenv("TMP");
	if (!tmp) tmp = getenv("TEMP");
	if (!tmp) tmp = "C:\\Temp";

	m_tmp_dir = tmp;
#else
	m_tmp_dir = P_tmpdir;
#endif

	m_tmp_dir += "/dropbox-diff/";

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
	// Remove all recorded files
	std::for_each(m_files.begin(), m_files.end(), rm());
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
// diff
//
// Returns result of system() call (0 on success).
//
string DropboxDiffPluginAPI::diff(
	const string& cmd,
	const string& left_name,
	const string& left_text,
	const string& right_name,
	const string& right_text
)
{
	// Create temporary directory if it doesn't already exist
	struct stat s;
	if (stat(m_tmp_dir.c_str(), &s) != 0) mkdir(m_tmp_dir.c_str(), 0777);

	// Write temporary files
	write_file(m_tmp_dir + left_name, left_text);
	write_file(m_tmp_dir + right_name, right_text);

	// Do any required quoting and substitutions
	string cmd_actual(cmd);

	string q_left = quote(left_name);
	string q_right = quote(right_name);

	if (cmd_actual.find("$1") != string::npos) {
		// Do file name substitutions
		replace_in_place(cmd_actual, "$1", q_left);
		replace_in_place(cmd_actual, "$2", q_right);
	}
	else {
		// Append file names
		cmd_actual += ' ';
		cmd_actual += q_left;
		cmd_actual += ' ';
		cmd_actual += q_right;
	}

	// Compute full command

	// Change to the temp directory
	string cmd_full = "cd \"";
	cmd_full += m_tmp_dir;
	cmd_full += "\" && ";

#if defined(_WIN32)
	// For Windows, spawn process in the background
	cmd_full += "start \"DropboxDiff\" ";
#endif

	cmd_full += cmd_actual;

#if !defined(_WIN32)
	// For non-Windows, spawn process in the background
	cmd_full += " &";
#endif

	trace(cmd_full);

	int code = system(cmd_full.c_str());

	if (code)
	{
		stringstream result;
		result
			<< "error code: " << code << endl
			<< "command: " << cmd_actual
		;

		return result.str();
	}

	return "";
}


// ===== Utility functions


void DropboxDiffPluginAPI::write_file(const string& name, const string& text)
{
	// Skip if file exists already
	struct stat s;
	if (stat(name.c_str(), &s) == 0) return;

	m_files.insert(name);

	// Write it
	ofstream f;
	f.open(name.c_str(), ios::out | ios::app | ios::binary);
	f << text;
	f.close();
}


// Command-line quoting
#if defined(_WIN32)
#	define ESC_CHAR "^"
#else
#	define ESC_CHAR "\\"
#endif

static string quote(const string& s)
{
	string result = s;

	// Escape any escape char instances
	replace_in_place(result, ESC_CHAR, ESC_CHAR ESC_CHAR);

	// Escape any embedded quotes (should be none)
	replace_in_place(result, "\"", ESC_CHAR "\"");

	// Perform actual quoting
	return string("\"") + result + "\"";
}


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

