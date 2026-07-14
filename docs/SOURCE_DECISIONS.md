# Source Decisions

## ITU Syria Numbering Plan

The initial seed uses the ITU-hosted Syria numbering-plan PDF because it is a
public national numbering-plan reference and includes enough factual metadata to
bootstrap a useful telecom dataset.

Accepted fields:

- country calling code,
- fixed area-code rows,
- mobile prefix assignments,
- public operator names,
- reserved, used, unused, short-number, and private-numbering ranges,
- source record dates.

Not imported:

- source PDF copies,
- non-factual narrative text,
- personal subscriber numbers,
- live network status,
- tower, coverage, outage, surveillance, or interception data.

## OpenSyria Geography

Fixed area-code records use OpenSyria geography IDs for governorate links. The
geography source does not establish telecom facts; it only provides stable local
administrative identifiers.
