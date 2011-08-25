/**********************************************************\

  Auto-generated DropboxDiffPluginAPI.h

\**********************************************************/

#include <string>
#include <boost/weak_ptr.hpp>
#include "JSAPIAuto.h"
#include "BrowserHost.h"
#include "DropboxDiffPlugin.h"
#include "Logger.h"

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

	// Methods
	long diff(
		const std::string& cookie,
		const std::string& cmd,
		const std::string& left_url,
		const std::string& left_name,
		const std::string& right_url,
		const std::string& right_name
	) const;

	// Logger implementation
	virtual void trace(const std::string& s) const;

private:
	DropboxDiffPluginWeakPtr	m_plugin;
	mutable FB::BrowserHostPtr	m_host;

	bool						m_debug;
};

#endif // H_DropboxDiffPluginAPI

