import express from "express";
import cors from "cors";
import * as dayjs from "dayjs";
import joi from "joi";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;
mongoClient.connect(() => {
	db = mongoClient.db("batepapo-uol");
});

const app = express();
app.use(express.json());
app.use(cors());

const nameSchema = joi.object({
	name: joi.string().required(),
	lastStatus: joi.number(),
});

app.post("/participants", async (req, res) => {
	try {
		const { name } = req.body;
		const newUser = { name, lastStatus: Date.now() };

		const validation = nameSchema.validate(newUser, { abortEarly: true });

		if (validation.error) {
			console.log(validation.error.details);
			return res.sendStatus(422);
		}

		/* if (await db.collection("customers").find().toArray().forEach()){
			return res.sendStatus(409)
		} */

		await db.collection("participants").insertOne(newUser);
		res.sendStatus(201);
	} catch (err) {
		res.sendStatus(500);
	}
});

app.get("/participants", async (req, res) => {
	try {
		const participants = await db.collection("participants").find().toArray();
		res.send(participants);
	} catch (err) {
		res.sendStatus(500);
	}
});

app.post("/messages", (req, res) => {
	const { to, text, type } = req.body;
	const from = req.headers.User;

	/* const isFromValidedUSer = participants.find((el) => el.User === from); */

	for (i in participants) {
		if (to != "" || text != "") {
			continue;
		}
		if (type === "message" || type === "privade_message") {
			continue;
		}
		if (from === participants[i].name) {
			return res.sendStatus(201);
		}
	}

	res.sendStatus(422);
});

app.get("/messages", (req, res) => {
	const { limit } = req.query;
	const User = req.headers.User;
});

app.post("/status", (req, res) => {
	const User = req.headers.User;

	const isFromValidedUSer = participants.find((el) => el.User === from);

	if (isFromValidedUSer) {
		return res.sendStatus(200);
	}

	res.sendStatus(404);
});

app.listen(5000, () => {
	console.log("Listening on port 5000");
});
