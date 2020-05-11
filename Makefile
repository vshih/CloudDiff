
help:
	@echo Available targets: help zip

zip:	clouddiff.zip


INCLUDE_LIST = $(addprefix chrome-extension, $(shell cd chrome-extension; find . \
		\( \
			   -name \*.swp \
			-o -name .ignore \
			-o -name .vagrant \
			-o -name manifest.json \
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
	@< chrome-extension/manifest.json jq 'delpaths([["key"]])' | zip $@	-
	@printf '@ -\n@=chrome-extension/manifest.json\n' | zipnote -w $@
	@ls -hl $@

biggest:	clouddiff.zip
	@unzip -lv $< | tail -n +4 | sort -k3nr | less


test:
	@echo $(subst .dot,.svg,$(wildcard doc/*.dot))

doc:	$(subst .yml,.svg,$(wildcard doc/*.yml))

doc/%.svg:	doc/%.dot
	dot -Tsvg $< -o $@

doc/%.dot:  doc/%.yml
	bin/yml-to-dot.py $< > $@

