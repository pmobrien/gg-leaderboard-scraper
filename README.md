A quick and dirty project to pull results from the Granite Games 2017 [Leaderboard](http://registration.floelite.com/competitions/10/divisions/51/scoreboard?page=1) and provide some statistical analysis.

The service providing the leaderboard (FloElite) does not have any endpoints available, and it's all rendered server side so the only way to build the results is to parse through the html.

# Server
The server has one "endpoint": `GET /calculate/{division}`, where `{division}` is the number of the division you wish to retrieve data for.

Options for the divisions are:

- 47: Pro/AsRx Men Team of 3
- 48: Pro/AsRx Women Team of 3
- 51: Intermediate/Scaled Men Team of 3
- 52: Intermediate/Scaled Women Team of 3
- 55: Masters 35+ Men Team of 3
- 56: Masters 35+ Women Team of 3

The response will look something like:

```javascript
{
  "wods": [
    {
      "number": 1,
      "submissions": 5,
      "unit": "pounds",
      "values": [
        919,
        895,
        860,
        903,
        929
      ]
    },
    {
      "number": 2,
      "submissions": 4,
      "unit": "reps",
      ...
    },
    ...
}
```

`wods`: The list of all of the wods.

Each `wod` will have:

- `number`: The number of the wod.
- `submissions`: How many results have been submitted for this `wod`. Does not include any submissions with the value `0`.
- `unit`: The unit we are counting by for this `wod` (usually `reps` or `pounds`).
- `values`: An array of all the results for this `wod`. This array is not sorted, and it does not include any submissions with the value `0`.


# Client
The client provides a selector to choose a division, and when the `Calculate` button is pressed, fetches the results from the client and provides some statistics based on those.