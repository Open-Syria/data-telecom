# Review Process

Every data change should answer:

- What public source supports this fact?
- Is the source approved in `data/sources.json`?
- Does the record include matching `sourceIds` and `sourceReferences`?
- Is the data within telecom numbering scope?
- Could the record expose personal, private, live, or sensitive network data?

Maintainers should reject records that drift into subscriber directories,
coverage status, towers, outages, surveillance, or proprietary datasets.
