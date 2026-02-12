import { NationalEmblemsPreventionNames } from '../models/index'


export const _checkAvailability = async (firmName: string) => {
    return await NationalEmblemsPreventionNames.aggregate(
        [
            { $match: { $text: { $search: firmName } } },
            { $project: { name: 1, _id: 0 } }
        ]
    );
}



