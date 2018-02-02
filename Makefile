
help:
	@echo Available targets: help zip

zip:	clouddiff.zip


INCLUDE_LIST = $(addprefix chrome-extension, $(shell cd chrome-extension; find . \
		\( \
			   -name \*.swp \
			-o -name .ignore \
			-o -name .vagrant \
		\) \
		-prune \
	-o \
		-type f \
		\( \
			! -wholename ./lib/codemirror-\* \
			-o \( -false \
				$(addprefix -o -wholename ./, \
					$(shell awk -F'"' '/lib\/codemirror-/ {print $$2}' chrome-extension/manifest.json) \
				) \
			\) \
		\) \
		-print |\
	cut -c2- \
))

clouddiff.zip:	chrome-extension
	@-rm -f $@
	zip $@ $(INCLUDE_LIST)
	@echo
	@ls -hl $@

biggest:	clouddiff.zip
	@unzip -lv $< | tail -n +4 | sort -k3nr | less

