import { deleteFileObs } from "observable-fs";
import { catchError, of } from "rxjs";

export function deleteFile$(filePath: string, ignoreIfNotExisting = true) {
    return deleteFileObs(filePath).pipe(
        catchError((err) => {
            if (err.code === 'ENOENT' && ignoreIfNotExisting) {
                // complete so that the next operation can continue
                return of(null);
            }
            throw new Error(err);
        }),
    );
}