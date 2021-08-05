import * as Discord from 'discord.js'
import { APIApplicationCommand, APIInteractionResponseCallbackData, InteractionResponseType, APIMessage, RESTGetAPIApplicationGuildCommandsResult, RESTPostAPIApplicationCommandsJSONBody, APIApplicationCommandInteraction, APIApplicationCommandInteractionDataOptionWithValues } from 'discord-api-types/v8'
import db from './firestore'
import { firestore } from 'firebase-admin'
import { stripIndent } from 'common-tags'

import { commandIDs, token } from './config.json'
import { check, no } from './emoji.json'

// @ts-expect-error
class Client extends Discord.Client {
    readonly api: {
        applications(id: string): {
            commands: any
            guilds(id: string): {
                commands: any
            }
        },
        interactions(id: string, token: string): {
            callback: any
        },
        webhooks(id: string, token: string): {
            messages(id: string): any
        }
    }
}

const client = new Client({
    messageCacheMaxSize: 0,
    restTimeOffset: 100,
    ws: {
        intents: ['GUILDS']
    }
})

client.on('ready', async () => {
    console.log(`✓ Connected! ${client.user.tag}`)

    setInterval(() => 
        client.user.setActivity({
            type: 'WATCHING',
            name: `slash commands on ${client.guilds.cache.size} servers • /help`
        })
    , 300000)
})

// @ts-expect-error
client.ws.on('INTERACTION_CREATE', async (interaction: APIApplicationCommandInteraction) => {
    const permissions = new Discord.Permissions(Number(interaction.member.permissions))
    const respond = (data: APIInteractionResponseCallbackData) =>
        client.api.interactions(interaction.id, interaction.token).callback
            .post({data: {type: InteractionResponseType.ChannelMessageWithSource, data}})
    const option = (name: string) => (interaction.data.options.find(o => o.name === name) as APIApplicationCommandInteractionDataOptionWithValues)?.value as string

    if (interaction.data.id === commandIDs.ping) {
        await respond({content: 'Ping!'})
        const start = Discord.SnowflakeUtil.deconstruct(interaction.id).timestamp
        const end = await client.api.webhooks(client.user.id, interaction.token).messages('@original').patch({data: {}}).then((m: APIMessage) => new Date(m.timestamp).getTime())
        const edit = (text: string) => client.api.webhooks(client.user.id, interaction.token).messages('@original').patch({data: {content: text}})
        edit(`🏓 Pong! Took **${end - start}**ms.`)

    } else if (interaction.data.id === commandIDs.help) {
        respond({
            content: stripIndent`
                Slashtags is a simple [slash command](<https://support.discord.com/hc/en-us/articles/1500000368501>) tag bot.
                • Use /create to create a tag, /edit to edit a tag, and /delete to delete a tag.
                • All created tags will show when a user types /, making them easy to discover.
                • The Manage Server permission is required to manage tags.
                • Due to Discord limits, you can create up to 100 Slashtags per server. Slash commands may not show in servers with over 50 bots.
                Created by [advaith](<https://advaith.io>) • [Add to your server](<https://discord.com/api/oauth2/authorize?client_id=790910161953882147&scope=bot+applications.commands>) • [Privacy Policy](<https://gist.github.com/advaith1/6fd1ad3ed1ad30304ba97528f5561935>)`
        })

    } else if (interaction.data.id === commandIDs.create) {
        if (!permissions.has('MANAGE_GUILD'))
            return respond({content: no+'you do not have the Manage Server permission'})
        if (!/^[\w-]{1,32}$/.test(option('name')))
            return respond({content: no+"name is invalid: must be 1 to 32 characters and can't contain spaces"})
        if (!option('description') || option('description').length > 100)
            return respond({content: no+'description must be 1 to 100 characters'})
        if (!option('content') || option('content').length > 2000)
            return respond({content: no+'content must be 1 to 2000 characters'})

        let error = false
        const command = await client.api.applications(client.user.id).guilds(interaction.guild_id).commands.post({data: {
            name: option('name'),
            description: option('description')
        } as RESTPostAPIApplicationCommandsJSONBody }).catch((e: Discord.DiscordAPIError) => {
            error = true
            respond({content: no+`error: ${e}`, allowed_mentions: {parse: []}})
        }) as APIApplicationCommand

        await db.collection('guilds').doc(interaction.guild_id).set({
            [command.id]: {
                content: option('content'),
                ephemeral: option('ephemeral')
            }
        }, { merge: true }).catch(e => {
            error = true
            respond({content: no+`error: ${e}`, allowed_mentions: {parse: []}})
        })

        if (!error) respond({content: check+'created!'})

    } else if (interaction.data.id === commandIDs.edit) {
        if (!permissions.has('MANAGE_GUILD'))
            return respond({content: no+'you do not have the Manage Server permission'})
        if (!option('name') && !option('description') && !option('content'))
            return respond({content: no+"you didn't provide any new data!"})
        if (!/^[\w-]{1,32}$/.test(option('newname')))
            return respond({content: no+"newname is invalid: must be 1 to 32 characters and can't contain spaces"})
        if (option('description') && option('description').length > 100)
            return respond({content: no+'description must be 1 to 100 characters'})
        if (option('content') && option('content').length > 2000)
            return respond({content: no+'content must be 1 to 2000 characters'})

        let error = false
        const commands = await client.api.applications(client.user.id).guilds(interaction.guild_id).commands.get().catch((e: Discord.DiscordAPIError) => {
            error = true
            respond({content: no+`error: ${e}`, allowed_mentions: {parse: []}})
        }) as RESTGetAPIApplicationGuildCommandsResult
        const command = commands.find(c => c.name === option('name'))
        if (!command) return respond({content: no+`command "${option('name')}" not found`, allowed_mentions: {parse: []}})

        if (option('name') || option('description'))
            await client.api.applications(client.user.id).guilds(interaction.guild_id).commands(command.id).patch({data: {
                name: option('newname'),
                description: option('description')
            }}).catch((e: Discord.DiscordAPIError) => {
                error = true
                respond({content: no+`error: ${e}`, allowed_mentions: {parse: []}})
            })
        if (option('content') || option('ephemeral') !== undefined)
            await db.collection('guilds').doc(interaction.guild_id).set({
                [command.id]: {
                    content: option('content'),
                    ephemeral: option('ephemeral')
                }
            }, { merge: true }).catch(e => {
                error = true
                respond({content: no+`error: ${e}`, allowed_mentions: {parse: []}})
            })

        if (!error) respond({content: check+'edited!'})

    } else if (interaction.data.id === commandIDs.delete) {
        if (!permissions.has('MANAGE_GUILD')) return respond({content: no+'you do not have the Manage Server permission'})

        let error = false
        const commands = await client.api.applications(client.user.id).guilds(interaction.guild_id).commands.get().catch((e: Discord.DiscordAPIError) => {
            error = true
            respond({content: no+`error: ${e}`, allowed_mentions: {parse: []}})
        }) as RESTGetAPIApplicationGuildCommandsResult
        const command = commands.find(c => c.name === option('name'))
        if (!command) return respond({content: no+`command "${option('name')}" not found`, allowed_mentions: {parse: []}})

        await client.api.applications(client.user.id).guilds(interaction.guild_id).commands(command.id).delete().catch((e: Discord.DiscordAPIError) => {
            error = true
            respond({content: no+`error: ${e}`, allowed_mentions: {parse: []}})
        })
        await db.collection('guilds').doc(interaction.guild_id).update({
            [command.id]: firestore.FieldValue.delete()
        }).catch(e => {
            error = true
            respond({content: no+`error: ${e}`, allowed_mentions: {parse: []}})
        })

        if (!error) respond({content: check+'deleted!'})
    
    } else {
        const doc = await db.collection('guilds').doc(interaction.guild_id).get()
        const tag = doc.data()[interaction.data.id] as {
            content: string
            ephemeral?: boolean
        }
        respond({content: tag?.content, flags: tag?.ephemeral ? 1 << 6 : 0, allowed_mentions: {parse: []}})
            .catch((e: Discord.DiscordAPIError) =>
                new Discord.WebhookClient(client.user.id, interaction.token).send(no+`error: ${e}`, {allowedMentions: {parse: []}}))
    }

})

client.login(token)
