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

const messageSchema = joi.object({
	to: joi.string().required().trim(),
	text: joi.string().required(),
	from: joi.string().required().trim(),
	type: joi.string().required().trim().valid("message", "private_message"),
	time: joi.string(),
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
			time: dayjs().format("HH:mm:ss"),
		};
		console.log(name);

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

app.post("/messages", async (req, res) => {
	try {
		const { to, text, type } = req.body;
		const from = req.headers.user;
		const newMessage = {
			from: from.trim(),
			to,
			text,
			type,
			time: dayjs().format("HH:mm:ss"),
		};
		const validation = messageSchema.validate(newMessage, { abortEarly: true });

		console.log(newMessage);

		if (validation.error) {
			console.log(validation.error.message);
			return res.sendStatus(422);
		}

		if ((await isThereAName(from)) === false) {
			return res.sendStatus(422);
		}

		await db.collection("messages").insertOne(newMessage);
		res.sendStatus(201);
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
});

app.get("/messages", async (req, res) => {
	try {
		const { limit } = req.query;
		const { user } = req.headers;
		const messages = await db.collection("messages").find().toArray();
		const filteredMensages = messages.filter(
			(el) =>
				el.from === user ||
				el.to === user ||
				el.type === "message" ||
				el.type === "status",
		);

		if (limit) {
			return res.send(filteredMensages.slice(-limit));
		}

		res.send(filteredMensages);
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
