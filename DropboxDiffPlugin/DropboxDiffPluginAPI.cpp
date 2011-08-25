/**********************************************************\

  Auto-generated DropboxDiffPluginAPI.cpp

\**********************************************************/

#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"

#include "DropboxDiffPluginAPI.h"

#include <curl/curl.h>
#include <sys/stat.h>


using namespace std;

static CURLcode	get_file(const string& cookie, const string& url, const string& name);
static string	tmp_dir();
static void		replace_in_place(string& target, const string& s, const string& r);
static string	quote(const string& s);


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
	m_debug(false)
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
// diff
//
// Returns result of system() call (0 on success).
//
long DropboxDiffPluginAPI::diff(
	const string& cookie,
	const string& cmd,
	const string& left_url,
	const string& left_name,
	const string& right_url,
	const string& right_name
) const
{
	// Create temporary directory, if it doesn't already exist
	string dir = tmp_dir() + "dropbox-diff/";

	struct stat s;

	if (stat(dir.c_str(), &s) != 0) {
		mkdir(dir.c_str(), 0777);
	}

	// Download files
	CURLcode result;

	if ((result = get_file(cookie, left_url, dir + left_name)) != CURLE_OK) return (int)result;
	if ((result = get_file(cookie, right_url, dir + right_name)) != CURLE_OK) return (int)result;

	// Change directory to sandbox
	string cmd_cd = "cd \"";
	cmd_cd += dir;
	cmd_cd += "\" && ";

#if defined(_WIN32)
	// For Windows, spawn process in the background
	cmd_cd += "start \"DropboxDiff\" ";
#endif

	cmd_cd += cmd;

	string q_left = quote(left_name);
	string q_right = quote(right_name);

	if (cmd.find("$1") != string::npos) {
		// Do file name substitutions
		replace_in_place(cmd_cd, "$1", q_left);
		replace_in_place(cmd_cd, "$2", q_right);
	}
	else {
		// Append file names
		cmd_cd += ' ';
		cmd_cd += q_left;
		cmd_cd += ' ';
		cmd_cd += q_right;
	}

#if !defined(_WIN32)
	// For non-Windows, spawn process in the background
	cmd_cd += " &";
#endif

	trace(cmd_cd);

	return system(cmd_cd.c_str());
}

// ===== Utility functions

static string tmp_dir()
{
	return string(getenv(
#if defined(_WIN32)
		"TMP"
#else
		"TMPDIR"
#endif
	));
}

static CURLcode get_file(const string& cookie, const string& url, const string& name)
{
	// Skip if file exists already
	struct stat s;

	if (stat(name.c_str(), &s) == 0) return CURLE_OK;

	// Download it
	CURL* curl = curl_easy_init();

	if (!curl) return CURLE_FAILED_INIT;

	curl_easy_setopt(curl, CURLOPT_URL, url.c_str());

	// TODO Verify server's certificate
	curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);

	// TODO Verify hostname
	curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);

	curl_easy_setopt(curl, CURLOPT_COOKIE, cookie.c_str());

	FILE* f = fopen(name.c_str(), "w");

	curl_easy_setopt(curl, CURLOPT_WRITEDATA, f);

	CURLcode res = curl_easy_perform(curl);

	// Cleanup
	curl_easy_cleanup(curl);

	fclose(f);

	return res;
}


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

