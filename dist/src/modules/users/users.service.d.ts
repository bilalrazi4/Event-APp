import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    create(name: string, email: string): Promise<User>;
    findOne(id: string): Promise<User | null>;
}
