# Field Reference

## Shared Provenance Fields

| Field | Meaning |
| --- | --- |
| `sourceIds` | Approved source registry IDs supporting the record. |
| `sourceReferences` | Source-specific IDs, dates, and access timestamps. |
| `sourceStatus` | Publication status of the record in this dataset. |
| `notes` | Optional maintainer note for ambiguity or scope decisions. |

## Numbering Fields

| Field | Meaning |
| --- | --- |
| `countryCode` | International country calling code without `+`. |
| `nationalPrefix` | Trunk prefix used in national dialing, currently `0`. |
| `internationalPrefix` | International access prefix; null until explicitly sourced. |
| `areaCode` | Fixed geographic area code without the trunk prefix. |
| `dialingPrefix` | National form with the trunk prefix, such as `011`. |
| `prefix` | Mobile prefix without the trunk prefix, such as `93`. |
| `subscriberNumberLength` | Digits after an area code or mobile prefix. |
| `nationalSignificantNumberLength` | Digits after the country code. |
| `rangeType` | Classification for reserved, used, unused, short, or private ranges. |
