/**********************************************************\

  Auto-generated DropboxDiffPluginAPI.h

\**********************************************************/

#include <string>
#include <boost/weak_ptr.hpp>
#include "JSAPIAuto.h"
#include "BrowserHost.h"
#include "DropboxDiffPlugin.h"
#include "SimpleStreamHelper.h"
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
	);

	// Logger implementation
	virtual void trace(const std::string& s) const;

protected:
	long get_file(const std::string& cookie, const std::string& url, const std::string& name);

    void get_url_callback(const FB::JSObjectPtr& callback, bool success, const FB::HeaderMap& headers,
        const boost::shared_array<uint8_t>& data, const size_t size);

private:
	DropboxDiffPluginWeakPtr	m_plugin;
	mutable FB::BrowserHostPtr	m_host;

	bool						m_debug;
};

#endif // H_DropboxDiffPluginAPI

