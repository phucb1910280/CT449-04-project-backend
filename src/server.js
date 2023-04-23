import express from 'express';
import bodyParser, { json } from 'body-parser';
import { ExplainVerbosity, MongoClient } from 'mongodb';
import path from 'path';

const app = express();
app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, '../assets')));

app.get('/api/products', async (req, res) => {
    const client = await MongoClient.connect(
        'mongodb://127.0.0.1:27017',
    );
    const db = client.db('project-vue-db');
    const products = await db.collection('products').find({}).toArray();
    res.status(200).json(products);
    client.close();
});

app.get('/api/products/:productId', async (req, res) => {
    const { productId } = req.params;
    const client = await MongoClient.connect(
        'mongodb://127.0.0.1:27017',
    );
    const db = client.db('project-vue-db');
    const product = await db.collection('products').findOne({ id: productId});
    
    if (product) {
        res.status(200).json(product);
    } else {
        res.status(404).json('Could not find the product!');
    }
    client.close();
});

app.get('/api/users/:userId/cart', async (req, res) => {
    const { userId } = req.params;
    const client = await MongoClient.connect(
        'mongodb://127.0.0.1:27017',
    );
    const db = client.db('project-vue-db');
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) return res.status(404).json('Can not find user!');
    const products = await db.collection('products').find({}).toArray();
    const cartItemsIds = user.cartItems;
    const cartItems = cartItemsIds.map(id => products.find(product => product.id === id));
    res.status(200).json(cartItems);
    client.close();
});

app.post('/api/users/:userId/cart', async (req, res) => {
    const {userId} =  req.params;
    const {productId} =  req.body;
    const client = await MongoClient.connect(
        'mongodb://127.0.0.1:27017',
    );
    const db = client.db('project-vue-db');
    await db.collection('users').updateOne({id: userId}, {
        $addToSet: { cartItems : productId},
    });
    const user = await db.collection('users').findOne({id: userId});
    const products = await db.collection('products').find({}).toArray();
    const cartItemsIds = user.cartItems;
    const cartItems = cartItemsIds.map(id => products.find(product => product.id === id));
    res.status(200).json(cartItems);
    client.close();
}); 

app.delete('/api/users/:userId/cart/:productId', async (req, res)=> {
    const { userId, productId } = req.params;
    const client = await MongoClient.connect(
        'mongodb://127.0.0.1:27017',
    );
    const db = client.db('project-vue-db');
    await db.collection('users').updateOne({id: userId}, {
        $pull: { cartItems: productId},
    });
    const user = await db.collection('users').findOne({id: userId});
    const products = await db.collection('products').find({}).toArray();
    const cartItemsIds = user.cartItems;
    const cartItems = cartItemsIds.map(id => products.find(product => product.id === id));

    res.status(200).json(cartItems);
    client.close();
});

app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});