# code-turnover
**code-turnover** is a measure about how a code base has been changed in a certain period of time.

The calculation starts considering all the commits in the period of time. Then for each commit, it retrieves the differences between that commit and its parent commit by file (i.e. the difference is calculated for each file that has changed in that particular commit).

Then it sums up the number of lines of code that have been modified, added or removed for each file in each commit for the period ot time. **code-turnover** is the sum of lines of code modified, added or removed in each commit in the period of time.

It can be used as a proxy to evaluate the amount of work spent on a certain file or repo.

The logic for which this can be considered a proxy of work is the following:
- a dev writes code as part of this work (let's say 25% of the time)
- writing code means modifing, addind and removing lines of code
- the more lines of code I have modified, added or remove on a certain file or repo on certain period of time can be an approximation of how much work I have spent on the file or repo

There are some clear cases where the above rule does not work. 
- For instance, when there is a massive refactoring that moves around files and renames folders, but that actually do not change any logic. In these cases the **code-turnover** may be very big but in reality the work done is relatively minimal.
- Automatic reformatting may modify all lines of code without meaning any real work done.
- Code generators can create massive amounts of code with no relation with human work.

While calculating th **code-turnover** for a cetain repo we should consider such factors and remove them from the data we use.

With all its imperfections, **code-turnover** is a numeric objective measure which can help us understand where we spend our work.