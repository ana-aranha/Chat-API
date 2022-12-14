import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import joi from "joi";
import { strict as assert } from "assert";
import { stripHtml } from "string-strip-html";
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
});

assert.equal(
	stripHtml(`Some text <b>and</b> text.`).result,
	`Some text and text.`,
);

app.post("/participants", async (req, res) => {
	try {
		const name = stripHtml(req.body.name).result;
		const newUser = {
			name: name.trim(),
			lastStatus: Date.now(),
		};
		const validation = nameSchema.validate(newUser, { abortEarly: true });
		const invalidName = await db
			.collection("participants")
			.findOne({ name: name });
		const newStatus = {
			from: name.trim(),
			to: "Todos",
			text: "entra na sala...",
			type: "status",
			time: dayjs().format("HH:mm:ss"),
		};

		if (validation.error) {
			console.log(validation.error.message);
			return res.sendStatus(422);
		}

		if (invalidName) {
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
		console.error(err);
		res.sendStatus(500);
	}
});

app.post("/messages", async (req, res) => {
	try {
		const to = stripHtml(req.body.to).result;
		const text = stripHtml(req.body.text).result;
		const type = stripHtml(req.body.type).result;
		const from = stripHtml(req.headers.user).result;
		const validFrom = await db
			.collection("participants")
			.findOne({ name: from });
		const newMessage = {
			from: from.trim(),
			to,
			text,
			type,
		};
		const validation = messageSchema.validate(newMessage, {
			abortEarly: true,
		});

		if (validation.error) {
			console.log(validation.error.message);
			return res.sendStatus(422);
		}

		if (!validFrom) {
			return res.sendStatus(422);
		}

		await db
			.collection("messages")
			.insertOne({ ...newMessage, time: dayjs().format("HH:mm:ss") });
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
		console.error(err);
		res.sendStatus(500);
	}
});

app.delete("/messages/:ID_DA_MENSAGEM", async (req, res) => {
	try {
		const id = req.params.ID_DA_MENSAGEM;
		const user = stripHtml(req.headers.user).result;
		const message = await db
			.collection("messages")
			.findOne({ _id: new ObjectId(id) });

		if (message.from != user) {
			return res.sendStatus(401);
		}

		await db.collection("messages").deleteOne({ _id: new ObjectId(id) });
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(404);
	}
});

app.put("/messages/:ID_DA_MENSAGEM", async (req, res) => {
	try {
		const id = req.params.ID_DA_MENSAGEM;
		const from = stripHtml(req.headers.user).result;
		const to = stripHtml(req.body.to).result;
		const text = stripHtml(req.body.text).result;
		const type = stripHtml(req.body.type).result;
		const validFrom = await db
			.collection("participants")
			.findOne({ name: from });
		const newMessage = {
			from: from.trim(),
			to,
			text,
			type,
		};
		const message = await db
			.collection("messages")
			.findOne({ _id: ObjectId(id) });

		const validation = messageSchema.validate(newMessage, {
			abortEarly: true,
		});

		if (validation.error) {
			console.log(validation.error.message);
			return res.sendStatus(422);
		}

		if (!validFrom) {
			return res.sendStatus(422);
		}

		if (message.from != from) {
			return res.sendStatus(401);
		}

		await db.collection("messages").updateOne(
			{
				to: message.to,
				text: message.text,
				type: message.type,
			},
			{ $set: newMessage },
		);

		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(404);
	}
});

app.post("/status", async (req, res) => {
	try {
		const user = stripHtml(req.headers.user).result;
		const newStatus = { lastStatus: Date.now() };
		const validUser = await db
			.collection("participants")
			.findOne({ name: user });

		if (!validUser) {
			return res.sendStatus(404);
		}

		const selectedUser = await db
			.collection("participants")
			.findOne({ name: user });

		await db.collection("participants").updateOne(
			{
				lastStatus: selectedUser.lastStatus,
			},
			{ $set: newStatus },
		);

		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
});

setInterval(deleteInativatedUsers, 15000);

async function deleteInativatedUsers() {
	try {
		const participants = await db.collection("participants").find().toArray();
		participants
			.filter((el) => Date.now() - el.lastStatus > 10000)
			.forEach((el) => {
				const newStatus = {
					from: el.name,
					to: "Todos",
					text: "sai da sala...",
					type: "status",
					time: dayjs().format("HH:mm:ss"),
				};

				db.collection("participants").deleteOne({ _id: ObjectId(el._id) });
				db.collection("messages").insertOne(newStatus);
			});
	} catch (err) {
		console.log(err);
	}
}

app.listen(5000, () => {
	console.log("Listening on port 5000");
});
