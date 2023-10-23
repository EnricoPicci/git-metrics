export const CONFIG = {
    // Default concurrency (used in the mergeMap operator)
    CONCURRENCY: 12,

    // csv separator
    CSV_SEP: ',',
    // char to use instead of CSV_SEP in the content of a field (e.g. if the separator char is ',' and the same separator
    // is present in the content of a field, we need to substitue it with a different char to avoid that the split of fields
    // splits also the content of a single field): e.g.
    // aField: 'Jane, Adams'
    // is a single fild.
    // If ',' is the separator chat, then we need to transform 'Jane, Adams' to something like 'Jane; Adams' if we want to avoid
    // that the string 'Jane, Adams' is considered as 2 fields and not just 1 field
    CVS_SEP_SUBSTITUE: ' '
}