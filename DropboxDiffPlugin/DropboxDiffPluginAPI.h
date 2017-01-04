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
	std::string diff(
		const std::string& cmd,
		const std::string& left_name,
		const std::string& left_text,
		const std::string& right_name,
		const std::string& right_text
	);

	// Logger implementation
	virtual void trace(const std::string& s) const;

protected:
	void write_file(const std::string& name, const std::string& text);

private:
	DropboxDiffPluginWeakPtr	m_plugin;
	mutable FB::BrowserHostPtr	m_host;

	std::string					m_tmp_dir;
	std::set<std::string>		m_files;
	bool						m_debug;
};

#endif // H_DropboxDiffPluginAPI

