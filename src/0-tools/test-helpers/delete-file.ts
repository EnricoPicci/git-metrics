import { deleteFileObs } from 'observable-fs';
import { catchError, of } from 'rxjs';

export function deleteFile(file: string) {
    return deleteFileObs(file).pipe(
        catchError((err) => {
            if (err.code === 'ENOENT') {
                return of(null);
            }
        }),
    );
}
