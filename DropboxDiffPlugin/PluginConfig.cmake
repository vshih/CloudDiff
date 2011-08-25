#/**********************************************************\ 
#
# Auto-Generated Plugin Configuration file
# for DropboxDiff Plug-in
#
#\**********************************************************/

set(PLUGIN_NAME "DropboxDiffPlugin")
set(PLUGIN_PREFIX "DDP")
set(COMPANY_NAME "VictorShih")

# ActiveX constants:
set(FBTYPELIB_NAME DropboxDiffPluginLib)
set(FBTYPELIB_DESC "DropboxDiffPlugin 1.0 Type Library")
set(IFBControl_DESC "DropboxDiffPlugin Control Interface")
set(FBControl_DESC "DropboxDiffPlugin Control Class")
set(IFBComJavascriptObject_DESC "DropboxDiffPlugin IComJavascriptObject Interface")
set(FBComJavascriptObject_DESC "DropboxDiffPlugin ComJavascriptObject Class")
set(IFBComEventSource_DESC "DropboxDiffPlugin IFBComEventSource Interface")
set(AXVERSION_NUM "1")

# NOTE: THESE GUIDS *MUST* BE UNIQUE TO YOUR PLUGIN/ACTIVEX CONTROL!  YES, ALL OF THEM!
set(FBTYPELIB_GUID d8c429e0-3043-53fc-9364-479352fd1403)
set(IFBControl_GUID 3e828d57-00a0-5b62-9d17-e43160ec9155)
set(FBControl_GUID 8dd5ac47-3024-5a91-a55c-ddff57b7d390)
set(IFBComJavascriptObject_GUID 20caed7e-9654-5add-a30d-892278f9434a)
set(FBComJavascriptObject_GUID ce8b1259-c61a-5543-b750-5026ef547c39)
set(IFBComEventSource_GUID c177170e-4b03-52c1-9696-31015bebf35a)

# these are the pieces that are relevant to using it from Javascript
set(ACTIVEX_PROGID "VictorShih.DropboxDiffPlugin")
set(MOZILLA_PLUGINID "vicshih.com/DropboxDiffPlugin")

# strings
set(FBSTRING_CompanyName "Victor Shih")
set(FBSTRING_FileDescription "Plug-in to support DropboxDiff Chrome extension")
set(FBSTRING_PLUGIN_VERSION "1.0.0.0")
set(FBSTRING_LegalCopyright "Copyright 2011 Victor Shih")
set(FBSTRING_PluginFileName "np${PLUGIN_NAME}.dll")
set(FBSTRING_ProductName "DropboxDiff Plug-in")
set(FBSTRING_FileExtents "")
set(FBSTRING_PluginName "DropboxDiff Plug-in")
set(FBSTRING_MIMEType "application/x-dropbox-diff-plugin")

# Uncomment this next line if you're not planning on your plugin doing
# any drawing:

set (FB_GUI_DISABLED 1)

# Mac plugin settings. If your plugin does not draw, set these all to 0
set(FBMAC_USE_QUICKDRAW 0)
set(FBMAC_USE_CARBON 0)
set(FBMAC_USE_COCOA 0)
set(FBMAC_USE_COREGRAPHICS 0)
set(FBMAC_USE_COREANIMATION 0)
set(FBMAC_USE_INVALIDATINGCOREANIMATION 0)

# If you want to register per-machine on Windows, uncomment this line
#set (FB_ATLREG_MACHINEWIDE 1)
