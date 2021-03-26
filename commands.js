const ping = {
    name: 'ping',
    description: "Slashtags: Check the bot's response time"
}

const help = {
    name: 'help',
    description: 'Slashtags: Learn how to use Slashtags!'
}

const create = {
    name: 'create',
    description: 'Slashtags: Create a new Slashtag',
    options: [
        {
            name: 'name',
            description: 'The name of the Slashtag (1-32 characters)',
            type: 3,
            required: true
        },
        {
            name: 'description',
            description: 'The description of the Slashtag (1-100 characters)',
            type: 3,
            required: true
        },
        {
            name: 'content',
            description: 'The text to respond to this Slashtag with (1-2000 characters)',
            type: 3,
            required: true
        },
        {
            name: 'ephemeral',
            description: 'Whether this Slashtag response should only be visible to the command user (default false)',
            type: 5
        }
    ]
}

const edit = {
    name: 'edit',
    description: 'Slashtags: Edit a Slashtag',
    options: [
        {
            name: 'name',
            description: 'The (current) name of the Slashtag to edit. After entering, click the property(ies) to edit above.',
            type: 3,
            required: true
        },
        {
            name: 'newname',
            description: 'The new name of this Slashtag (1-32 characters)',
            type: 3
        },
        {
            name: 'description',
            description: 'The new description of this Slashtag (1-100 characters)',
            type: 3
        },
        {
            name: 'content',
            description: 'The new text to respond to this Slashtag with (1-2000 characters)',
            type: 3
        },
        {
            name: 'ephemeral',
            description: 'Whether this Slashtag response should only be visible to the command user',
            type: 5
        }
    ]
}

const deletecmd = {
    name: 'edit',
    description: 'Slashtags: Delete a Slashtag [guild]',
    options: [
        {
            name: 'name',
            description: 'The name of the Slashtag to delete',
            type: 3,
            required: true
        }
    ]
}
