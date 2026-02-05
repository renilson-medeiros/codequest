import asyncio
import database as db

async def test():
    # Criar uma quest
    quest_id = await db.create_quest("Test Quest", "Testing loot retrieval")
    print(f"Created quest: {quest_id}")
    
    # Checar antes
    quest_before = await db.get_quest(quest_id)
    print(f"Before: loot_retrieved = {quest_before.get('loot_retrieved')}")
    
    # Atualizar loot
    result = await db.update_quest_loot_retrieved(quest_id, True)
    print(f"Update result: {result}")
    
    # Checar depois
    quest_after = await db.get_quest(quest_id)
    print(f"After: loot_retrieved = {quest_after.get('loot_retrieved')}")

asyncio.run(test())
