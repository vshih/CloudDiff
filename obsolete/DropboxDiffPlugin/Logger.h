
#pragma once

#include <string>

class Logger
{
public:
	virtual void trace(const std::string& s) const = 0;
};

