---
type: regex
pattern: '\.\./04-validation-and-error-codes\.md'
match: contains
target: { source: file, path: docs/architecture/product-reviews/tasks/01-contracts-and-validations.md }
---
Task 01 links the validation block (relative to tasks/) instead of restating it.
Note: file-focused graders report "grader threw ... does not exist" when the agent never wrote the file
(typical for the no-plugin arm); that is a genuine fail, already counted by the file_exists graders.
