---
type: regex
pattern: 'AC-?2[\s\S]{0,300}(missing|not implemented|unimplemented|absent|ignored|no pagination|not paginated)|(missing|not implemented|no pagination|not paginated)[\s\S]{0,300}AC-?2'
flags: i
match: contains
target: last_message
---
The skipped acceptance criterion AC-2 (pagination) is called out as missing.
