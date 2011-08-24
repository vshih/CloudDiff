/**********************************************************\

  Auto-generated DropboxDiffPluginAPI.h

\**********************************************************/

#include <string>
#include <sstream>
#include <boost/weak_ptr.hpp>
#include "JSAPIAuto.h"
#include "BrowserHost.h"
#include "DropboxDiffPlugin.h"
#include "Logger.h"
#include "WebKitFS.h"

#ifndef H_DropboxDiffPluginAPI
#define H_DropboxDiffPluginAPI

class DropboxDiffPluginAPI : public FB::JSAPIAuto, public Logger
{
public:
	DropboxDiffPluginAPI(const DropboxDiffPluginPtr& plugin, const FB::BrowserHostPtr& host);
	virtual ~DropboxDiffPluginAPI();

	DropboxDiffPluginPtr getPlugin();

	// Properties
	std::string get_version() const;
	bool get_debug() const;
	void set_debug(bool val);
	std::string get_extension_id() const;
	void set_extension_id(const std::string& extension_id);

	// Methods
	long diff(const std::string& cmd, const std::string& left, const std::string& right) const;

	// Logger implementation
	virtual void trace(const std::string& s) const;

private:
	DropboxDiffPluginWeakPtr m_plugin;
	mutable FB::BrowserHostPtr m_host;

	bool		m_debug;
	WebKitFS	m_webkit_fs;
	std::string	m_extension_id;
};

#endif // H_DropboxDiffPluginAPI

