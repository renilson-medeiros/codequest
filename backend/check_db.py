import asyncio
import database as db
import json

async def check():
    db.init_db()
    quests = await db.get_all_quests()
    print("ALL QUESTS:")
    print(json.dumps(quests, indent=2))
    
    if quests:
        quest_id = quests[0]['id']
        details = await db.get_quest(quest_id)
        print("\nQUEST DETAILS (single):")
        print(json.dumps(details, indent=2))

if __name__ == "__main__":
    asyncio.run(check())
