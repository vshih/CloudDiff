/**********************************************************\

  Auto-generated DropboxDiffPluginAPI.h

\**********************************************************/

#include <string>
#include <sstream>
#include <boost/weak_ptr.hpp>
#include "JSAPIAuto.h"
#include "BrowserHost.h"
#include "DropboxDiffPlugin.h"

#ifndef H_DropboxDiffPluginAPI
#define H_DropboxDiffPluginAPI

class DropboxDiffPluginAPI : public FB::JSAPIAuto
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
	std::string compute_path(const std::string& extension_id, const std::string& beacon);
	long		exec(const std::string& cmd) const;

private:
	DropboxDiffPluginWeakPtr m_plugin;
	FB::BrowserHostPtr m_host;

	bool		m_debug;
	std::string	m_path;
};

#endif // H_DropboxDiffPluginAPI

