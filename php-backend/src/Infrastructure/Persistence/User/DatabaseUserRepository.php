<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence\User;

use App\Domain\User\User;
use App\Domain\User\UserRepository;
use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception;

class DatabaseUserRepository implements UserRepository
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function findAll(): array
    {
        $sql = 'SELECT * FROM users ORDER BY created_at DESC';
        $stmt = $this->connection->executeQuery($sql);
        $users = $stmt->fetchAllAssociative();

        return array_map([$this, 'createUserFromData'], $users);
    }

    public function findById(int $id): ?User
    {
        $sql = 'SELECT * FROM users WHERE id = ?';
        $stmt = $this->connection->executeQuery($sql, [$id]);
        $userData = $stmt->fetchAssociative();

        if (!$userData) {
            return null;
        }

        return $this->createUserFromData($userData);
    }

    public function findByUsername(string $username): ?User
    {
        $sql = 'SELECT * FROM users WHERE username = ?';
        $stmt = $this->connection->executeQuery($sql, [$username]);
        $userData = $stmt->fetchAssociative();

        if (!$userData) {
            return null;
        }

        return $this->createUserFromData($userData);
    }

    public function create(User $user): User
    {
        $sql = '
            INSERT INTO users (
                username, password, name, full_name, role, employee_id, 
                company, department, team, job_type, email, phone, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ';

        $this->connection->executeStatement($sql, [
            $user->getUsername(),
            $user->getPassword(),
            $user->getName(),
            $user->getFullName(),
            $user->getRole(),
            $user->getEmployeeId(),
            $user->getCompany(),
            $user->getDepartment(),
            $user->getTeam(),
            $user->getJobType(),
            $user->getEmail(),
            $user->getPhone()
        ]);

        $userId = (int)$this->connection->lastInsertId();
        return $this->findById($userId);
    }

    public function update(int $id, array $data): ?User
    {
        $allowedFields = [
            'username', 'password', 'name', 'full_name', 'role', 'employee_id',
            'company', 'department', 'team', 'job_type', 'email', 'phone'
        ];

        $updateFields = [];
        $updateValues = [];

        foreach ($data as $field => $value) {
            if (in_array($field, $allowedFields) && $value !== null) {
                $updateFields[] = $field . ' = ?';
                $updateValues[] = $value;
            }
        }

        if (empty($updateFields)) {
            return $this->findById($id);
        }

        $updateValues[] = $id;
        $sql = 'UPDATE users SET ' . implode(', ', $updateFields) . ', updated_at = NOW() WHERE id = ?';

        $this->connection->executeStatement($sql, $updateValues);
        return $this->findById($id);
    }

    public function delete(int $id): bool
    {
        $sql = 'DELETE FROM users WHERE id = ?';
        $result = $this->connection->executeStatement($sql, [$id]);
        return $result > 0;
    }

    public function usernameExists(string $username): bool
    {
        $sql = 'SELECT COUNT(*) FROM users WHERE username = ?';
        $count = $this->connection->fetchOne($sql, [$username]);
        return $count > 0;
    }

    public function findByRole(string $role): array
    {
        $sql = 'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC';
        $stmt = $this->connection->executeQuery($sql, [$role]);
        $users = $stmt->fetchAllAssociative();

        return array_map([$this, 'createUserFromData'], $users);
    }

    private function createUserFromData(array $data): User
    {
        return new User(
            (int)$data['id'],
            $data['username'],
            $data['password'],
            $data['name'],
            $data['full_name'],
            $data['role'],
            $data['employee_id'],
            $data['company'],
            $data['department'],
            $data['team'],
            $data['job_type'],
            $data['email'],
            $data['phone'],
            $data['created_at'],
            $data['updated_at']
        );
    }
}




