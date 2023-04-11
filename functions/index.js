const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors")
const bodyParser = require("body-parser")

const app = express()
admin.initializeApp({
	credential: admin.credential.cert("./permissions.json"),
	databaseURL: "https://watchful-audio-293805.firebaseio.com"
});

const db = admin.firestore();
const auth = admin.auth();
app.use(cors())
app.use(bodyParser.json())
app.get("/user/:id", (req, res) => {
	(async () => {
		const uid = req.params.id
		try {
			const doc = db.collection("users").doc(uid);
			const user = await doc.get();
			console.log("user >>> ", user);
			return res.status(200).json(user.data());
		} catch (error) {
			console.log("User doesn't exists");
			return res.status(500).send(error);
		}
	})();
});

app.post("/", async (req, res) => {
	try {
		await db.collection("user")
			.doc()
			.create({
				name: req.body.name,
				email: req.body.email,
				type: req.body.type
			})
		return res.status(204).json();
	} catch (error) {
		console.log(error)
		return res.status(500).send(error);
	}
});

app.post("/create", async (req, res) => {

	const email = req.body.email;
	const password = req.body.password;
	const name = req.body.name;
	console.log(req.body);

	await auth.createUser({
		email: email,
		password: password
	}).then(async (userRecord) => {
		console.log("Successfully created new user:", userRecord.uid);

		await db.collection("users")
			.doc("/" + userRecord.uid + "/")
			.create({
				uid: userRecord.uid,
				name: name,
				email: email,
				type: 0
			});

		return res.status(204).json();
	})
		.catch((error) => {
			console.log(error.code);
			if (error.code === "auth/email-already-exists") {
				return res.status(500).send({ msg: "Email already exists" });
			} else if (error.code === "auth/invalid-password") {
				return res.status(500).json({ msg: "Password must be 6 characters" });
			} else {
				return res.status(500).json({ msg: `Error creating new user: ${error.code}` });
			}
		});
});

exports.app = functions.https.onRequest(app);
