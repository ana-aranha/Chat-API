import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import joi from "joi";
import { MongoClient, ObjectId } from "mongodb";

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
	db = mongoClient.db("batepapo-uol");
});

const app = express();
app.use(express.json());
app.use(cors());

const nameSchema = joi.object({
	name: joi.string().required().trim(),
	lastStatus: joi.number(),
});

async function isThereAName(name) {
	const participants = await db.collection("participants").find().toArray();
	if (participants.filter((el) => el.name === name).length > 0) {
		return true;
	}
	return false;
}

app.post("/participants", async (req, res) => {
	try {
		const { name } = req.body;
		const newUser = { name: name.trim(), lastStatus: Date.now() };
		const validation = nameSchema.validate(newUser, { abortEarly: true });
		const newStatus = {
			from: name.trim(),
			to: "Todos",
			text: "entra na sala...",
			type: "status",
			time: dayjs().format("HH:MM:ss"),
		};

		if (validation.error) {
			console.log(validation.error.message);
			return res.sendStatus(422);
		}

		if ((await isThereAName(name.trim())) === true) {
			return res.sendStatus(409);
		}

		await db.collection("participants").insertOne(newUser);
		await db.collection("messages").insertOne(newStatus);
		res.sendStatus(201);
	} catch (err) {
		console.error(err);
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

app.get("/messages", async (req, res) => {
	try {
		const { limit } = req.query;
		const User = req.headers.User;
		const messages = await db.collection("messages").find().toArray();
		res.send(messages);
	} catch (err) {
		res.sendStatus(500);
	}
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
