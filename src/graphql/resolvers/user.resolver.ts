import { GraphQLResolveInfo } from "graphql";
import {createUser, getUser, getUsers} from "../services/user.service";
import { PubSub } from "graphql-subscriptions";

const pubSub = new PubSub();

export const usersResolver = {
    Query: {
        async users(_: any, args: Record<string, any>, context: any, info: GraphQLResolveInfo) {
            return await getUsers({info});
        },
        async user(_: any, args: Record<string, any>, context: any, info: GraphQLResolveInfo) {
            return await getUser({id: args.id, info});
        }
    },
    Mutation: {
        async createUser(_: any, {input}: Record<string, any>,) {
            const result = await createUser({email: input.email, username: input.username})
            pubSub.publish('POST_USER', {subscription: result });
            return result;
        },
        async updateUser() {},
        async deleteUser() {},
    },
    Subscription: {
        subscription: {
            subscribe: () => pubSub.asyncIterator(['POST_USER'])
        }
    }
}