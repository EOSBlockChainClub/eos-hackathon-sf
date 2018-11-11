#include <eosiolib/eosio.hpp>
#include <eosiolib/print.hpp>
#include "../eosio.token/eosio.token.hpp"

using namespace eosio;
using eosio::permission_level;

// Smart Contract Name: notechain
// Table struct:
//   notestruct: multi index table to store the notes
//     prim_key(uint64): primary key
//     user(name): account name for the user
//     note(string): the note message
//     timestamp(uint64): the store the last update block time
// Public method:
//   isnewuser => to check if the given account name has note in table or not
// Public actions:
//   update => put the note into the multi-index table and sign by the given account

// Replace the contract class name when you start your own project
CONTRACT notechain : public eosio::contract {
  private:
    bool isnewchat( name user_one, name user_two ) {
      // get chats between two users
      auto chat_index = _chats.get_index<name("getbyusers")>();
      auto chat_iterator = chat_index.find(user_one.value + user_two.value);

      return chat_iterator == chat_index.end();
    }

    bool doeschatwithidexist( uint64_t chat_id ) {
      auto chat_iterator = _chats.find(chat_id);

      return !(chat_iterator == _chats.end());
    }

    TABLE chatstruct {
      uint64_t      prim_key;  // primary key
      uint64_t      stake_requirement;
      uint64_t      response_window;

      name          user_one;
      uint64_t      user_one_staked;

      name          user_two;
      uint64_t      user_two_staked;

      // primary key
      auto primary_key() const { return prim_key; }

      // secondary key
      // only supports uint64_t, uint128_t, uint256_t, double or long double
      uint128_t get_by_users() const { return user_one.value + user_two.value; }
    };

    TABLE notestruct {
      uint64_t      prim_key;  // primary key
      name          user;      // account name for the user
      std::string   note;      // the note message
      uint64_t      timestamp; // the store the last update block time
      uint64_t      chatstruct_id;

      // primary key
      auto primary_key() const { return prim_key; }
      // secondary key
      // only supports uint64_t, uint128_t, uint256_t, double or long double
      uint64_t get_by_chat_id() const { return chatstruct_id; }
    };

    // create a multi-index table and support secondary key
    typedef eosio::multi_index< name("chatstruct"), chatstruct,
      indexed_by< name("getbyusers"), const_mem_fun<chatstruct, uint128_t, &chatstruct::get_by_users> >
      > chat_table;

    // create a multi-index table and support secondary key
    typedef eosio::multi_index< name("notestruct"), notestruct,
      indexed_by< name("getbychatid"), const_mem_fun<notestruct, uint64_t, &notestruct::get_by_chat_id> >
      > note_table;

    note_table _notes;
    chat_table _chats;

  public:
    using contract::contract;

    // constructor
    notechain( name receiver, name code, datastream<const char*> ds ):
                contract( receiver, code, ds ),
                _chats( receiver, receiver.value ),
                _notes( receiver, receiver.value ) {}

    ACTION create( name user, name user_two, uint64_t stake_requirement, uint64_t response_window ) {
      // to sign the action with the given account
      require_auth( user );

      print(_self);

      // create new / update note depends whether the user account exist or not
      if (isnewchat(user, user_two)) {
        // insert new chat
        _chats.emplace( _self, [&]( auto& new_chat ) {
          new_chat.prim_key           = _chats.available_primary_key();
          new_chat.user_one           = user;
          new_chat.user_two           = user_two;
          new_chat.stake_requirement  = stake_requirement;
          new_chat.response_window    = response_window;
        });
        print("Chat created\n");
        // staking dat eos
        // INLINE_ACTION_SENDER(eosio::token, transfer)(
        //    name("eosio.token"),
        //    { user, name("active") },
        //    { user, _self, stake_requirement, std::string("Staking for user 1") }
        // );
        action(permission_level{ user, name("active") },
          name("eosio.token"), name("transfer"),
          std::make_tuple(user, _self, stake_requirement, std::string("Staking for user 1"))
        ).send();
        print("User one staked\n");
      } else {
        print("Chat not created because it already exists between these two users\n");
      }
      // } else {
      //   // get object by secordary key
      //   auto note_index = _notes.get_index<name("getbyuser")>();
      //   auto &note_entry = note_index.get(user.value);
      //   // update existing note
      //   _notes.modify( note_entry, _self, [&]( auto& modified_user ) {
      //     modified_user.note      = note;
      //     modified_user.timestamp = now();
      //   });
      // }

      // _notes.emplace( _self, [&]( auto& new_note ) {
      //   new_note.prim_key    = _notes.available_primary_key();
      //   new_note.user        = user;
      //   new_note.note        = note;
      //   new_note.timestamp   = now();
      // });
    }

    // ACTION stake( name user, uint64_t chat_id ) {
    //   // to sign the action with the given account
    //   require_auth( user );

    //   auto chat = _chats.get(chat_id);

    //   if (user == chat.user_one) {
    //     chat.user_one_staked = msg.value;
    //   } else if (user == chat.user_two) {
    //     chat.user_two_staked = msg.value;
    //   }
    // }

    ACTION sendmessage( name user, uint64_t chat_id, std::string message ) {
      // to sign the action with the given account
      require_auth( user );

      // auto chat = _chats.get(chat_id);
      if (doeschatwithidexist(chat_id)) {
        _notes.emplace( _self, [&]( auto& new_note ) {
          new_note.prim_key       = _notes.available_primary_key();
          new_note.user           = user;
          new_note.note           = message;
          new_note.timestamp      = now();
          new_note.chatstruct_id  = chat_id;
        });
        print("Message created!\n");
      } else {
        print("Message not created because no chat exists.  Boo.");
      }
    }

};

// specify the contract name, and export a public action: update
EOSIO_DISPATCH( notechain, (create)(sendmessage) )
