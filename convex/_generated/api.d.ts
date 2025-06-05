/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chats from "../chats.js";
import type * as chatsHttp from "../chatsHttp.js";
import type * as crons from "../crons.js";
import type * as feedback from "../feedback.js";
import type * as fileStorage from "../fileStorage.js";
import type * as file_items from "../file_items.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as httpUtils from "../httpUtils.js";
import type * as imageHttp from "../imageHttp.js";
import type * as invitations from "../invitations.js";
import type * as messages from "../messages.js";
import type * as messagesHttp from "../messagesHttp.js";
import type * as profileDeletion from "../profileDeletion.js";
import type * as profiles from "../profiles.js";
import type * as profilesHttp from "../profilesHttp.js";
import type * as sandboxes from "../sandboxes.js";
import type * as subscriptions from "../subscriptions.js";
import type * as subscriptionsHttp from "../subscriptionsHttp.js";
import type * as teams from "../teams.js";
import type * as teamsHttp from "../teamsHttp.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chats: typeof chats;
  chatsHttp: typeof chatsHttp;
  crons: typeof crons;
  feedback: typeof feedback;
  fileStorage: typeof fileStorage;
  file_items: typeof file_items;
  files: typeof files;
  http: typeof http;
  httpUtils: typeof httpUtils;
  imageHttp: typeof imageHttp;
  invitations: typeof invitations;
  messages: typeof messages;
  messagesHttp: typeof messagesHttp;
  profileDeletion: typeof profileDeletion;
  profiles: typeof profiles;
  profilesHttp: typeof profilesHttp;
  sandboxes: typeof sandboxes;
  subscriptions: typeof subscriptions;
  subscriptionsHttp: typeof subscriptionsHttp;
  teams: typeof teams;
  teamsHttp: typeof teamsHttp;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
