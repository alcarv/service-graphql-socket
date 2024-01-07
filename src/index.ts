import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs, resolvers } from "./graphql";
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

dotenv.config();
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 4000;

const schema = makeExecutableSchema({ typeDefs, resolvers });


const bootstrapServer = async () => {
    const server = new ApolloServer({
        schema,
        plugins: [
            // Proper shutdown for the HTTP server.
            ApolloServerPluginDrainHttpServer({ httpServer }),
        
            // Proper shutdown for the WebSocket server.
            {
              async serverWillStart() {
                return {
                  async drainServer() {
                    await serverCleanup.dispose();
                  },
                };
              },
            },
          ],
    });
    await server.start();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    app.use("/graphql", expressMiddleware(server));

    app.get("/", (req, res) => {
        res.send("Hello World");
    });

    httpServer.listen(port, () => {
        console.log(`Express ready at http://localhost:${port} `);
        console.log(`Graphql ready at http://localhost:${port}/graphql `);
    })
};

bootstrapServer();

const wsServer = new WebSocketServer({
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // Pass a different path here if app.use
    // serves expressMiddleware at a different path
    path: '/graphql',
  });
  
  // Hand in the schema we just created and have the
  // WebSocketServer start listening.
  const serverCleanup = useServer({ schema }, wsServer);