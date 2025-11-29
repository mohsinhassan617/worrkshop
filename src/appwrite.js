import { Client, Account, Databases } from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('692935090021bcab8d1f'); // Your Project ID

export const account = new Account(client);
export const databases = new Databases(client);
export { client };