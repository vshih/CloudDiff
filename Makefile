
help:
	@echo Available targets: help zip

zip:	clouddiff.zip

clouddiff.zip:	chrome-extension
	-rm -f $@
	@zip -r $@ $^ -x \*.swp

