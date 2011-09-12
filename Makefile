
help:
	@echo Available targets: help zip

zip:	dropbox-diff.zip

dropbox-diff.zip:	dropbox-diff
	@zip -r $@ $^

