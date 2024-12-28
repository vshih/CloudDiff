
help:
	@echo Available targets: help dist


# ===== Distribution =====

CLOUDDIFF_DIR = chrome-extension/clouddiff
DROPBOX_DIR = chrome-extension/dropbox
LIB_DIR = chrome-extension/lib


dist:	\
		node_modules \
		$(CLOUDDIFF_DIR)/bundle.js \
		$(DROPBOX_DIR)/Dropbox-sdk.min.js \
		$(LIB_DIR)/jquery.alertable.css \
		$(LIB_DIR)/jquery.alertable.min.js \
		$(LIB_DIR)/jquery.min.js \
		$(LIB_DIR)/js.cookie.min.js
	@echo Done.


node_modules:
	npm clean-install

$(CLOUDDIFF_DIR)/bundle.js:	$(wildcard src/*.js) webpack.config.js
	npx webpack

$(DROPBOX_DIR)/Dropbox-sdk.%:	node_modules/dropbox/dist/Dropbox-sdk.%
	cp $< $@

$(LIB_DIR)/jquery.alertable.%:	node_modules/@claviska/jquery-alertable/jquery.alertable.%
	cp $< $@

$(LIB_DIR)/jquery.min.%:	node_modules/jquery/dist/jquery.min.%
	cp $< $@



# ===== Documentation =====

test:
	@echo $(subst .dot,.svg,$(wildcard doc/*.dot))

doc:	$(subst .yml,.svg,$(wildcard doc/*.yml))

doc/%.svg:	doc/%.dot
	dot -Tsvg $< -o $@

doc/%.dot:  doc/%.yml
	bin/yml-to-dot.py $< > $@



# ===== Legacy chrome-extension packaging =====

.PHONY:	clouddiff.zip

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
	@< chrome-extension/manifest.json jq 'delpaths([["key"]])' | zip $@ -
	printf '@ -\n@=chrome-extension/manifest.json\n' | zipnote -w $@
	@ls -hl $@

biggest:	clouddiff.zip
	@unzip -lv $< | tail -n +4 | sort -k3nr | less

