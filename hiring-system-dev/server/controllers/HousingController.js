import { isObjectIdOrHexString, Types } from 'mongoose';
import House from '../models/House.js';

export const getHousesList = async (_req, res) => {
    try {
        const houses = await House.find()
            .select('-__v')
            .populate({
                path: 'residents',
                select: '_id username firstName preferredName lastName phone email onboardingStatus',
                populate: {
                    path: 'onboardingStatus',
                    select: 'status',
                },
            })

            .populate({ path: 'facilityReports' })
            .lean()
            .exec();
        const filteredHouses = houses.map((house) => {
            return {
                ...house,
                residents: house.residents.filter((resident) => {
                    return resident.onboardingStatus && resident.onboardingStatus.status === 'Approved';
                }),
            };
        });
        res.status(200).send({ data: filteredHouses, code: 200, message: 'success' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const postAddHouse = async (req, res) => {
    try {
        const { address, landlord, title, facilityInfo } = req.body;

        const existingHouse = await House.findOne({ title }).exec();
        if (existingHouse) {
            return res.status(400).send({
                message: 'Title already exists, please choose a different title',
                code: 400,
            });
        }

        const newHouse = new House({ title, address, landlord, facilityInfo });
        await newHouse.save();

        const houses = await House.find()
            .select('-__v')
            .populate({ path: 'residents', select: '_id username firstName preferredName lastName phone email' })
            .populate({ path: 'facilityReports', select: '-__v' })
            .lean()
            .exec();

        res.status(201).send({ message: 'House added successfully', code: 201, data: houses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteHouse = async (req, res) => {
    const { houseId } = req.params;
    console.log(houseId);
    if (!isObjectIdOrHexString(houseId)) {
        return res.status(400).json({ message: 'Invalid house ID format' });
    }

    const id = new Types.ObjectId(houseId);
    console.log(houseId, id);

    try {
        const house = await House.findById(id).lean().exec();
        if (!house) {
            return res.status(404).json({ message: 'House not found' });
        }

        await House.findByIdAndDelete(houseId);

        const houses = await House.find()
            .select('-__v')
            .populate({ path: 'residents', select: '_id username firstName preferredName lastName phone email' })
            .populate({ path: 'facilityReports', select: '-__v' })
            .lean()
            .exec();
        return res.status(200).json({ message: 'House deleted successfully', code: 200, data: houses });
    } catch (error) {}
};
